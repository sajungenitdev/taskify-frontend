// lib/api/mappers.ts — append

import type { TenderSecurity } from "./tender.api";
import { budgetLabel, fmtDate } from "./tender.mapper";
import type { CompanyDocument } from "./tender.api";

/* ============================================================
 * SECURITY MAPPERS
 * ============================================================ */

/** UI-friendly shape: converts `dueDate` ISO → short display string,
 *  formats amount with ৳ symbol. */
export interface SecurityRowUI {
    id: string;
    entity: string;
    clientDescription: string;
    type: TenderSecurity["type"];
    amount: number;
    currency: string;       // always "৳" for display
    dueDate: string;        // "20 Oct 2026" or "" for blank
    docsStatus: "Attached" | "Missing";
    isDraft?: boolean;
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

/** Stats tile shape from the /security/stats response. */
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

/** UI shape used by DocCard / DocsGrid / AddDocModal */
export interface CompanyDocUI {
    id: string;
    category: CompanyDocument["category"];
    title: string;
    reference?: string;
    validity?: string;
    status: CompanyDocument["status"];
    action?: "View" | "Replace";
    fileUrl?: string;
    subtitle?: string;
    chips?: string[];
}

export function toCompanyDocUI(d: CompanyDocument): CompanyDocUI {
    return {
        id: d._id,
        category: d.category,
        title: d.title,
        reference: d.reference || undefined,
        validity: d.validity || undefined,
        status: d.status,
        action: d.action || "View",
        fileUrl: d.fileUrl || undefined,
        subtitle: d.subtitle || undefined,
        chips: Array.isArray(d.chips) ? d.chips : [],
    };
}