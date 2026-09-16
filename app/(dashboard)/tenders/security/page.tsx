"use client";

import { useMemo, useState } from "react";
import { SecurityHeader } from "@/components/tender/security/SecurityHeader";
import { SecurityStats } from "@/components/tender/security/SecurityStats";
import {
    SecurityFilters,
    type FilterState,
} from "@/components/tender/security/SecurityFilters";
import {
    SecurityTable,
    type SecurityRow,
    type SecurityType,
} from "@/components/tender/security/SecurityTable";
import { SecurityFooter } from "@/components/tender/security/SecurityFooter";

/* ---------- Config ---------- */
const ENTITIES = ["NGL-26", "NG-26", "JT"];
const TYPES: SecurityType[] = [
    "Tender Security",
    "Performance Security",
    "Bank Guarantee",
];

/* ---------- Seed data ---------- */
const INITIAL_ROWS: SecurityRow[] = [
    {
        id: "r1",
        entity: "NGL-26",
        clientDescription: "Bangladesh Bank — EViews Software",
        type: "Tender Security",
        amount: 50000,
        currency: "৳",
        dueDate: "20 Oct 2026",
        docsStatus: "Attached",
    },
    {
        id: "r2",
        entity: "NGL-26",
        clientDescription: "Bangladesh Bank — EViews Software",
        type: "Performance Security",
        amount: 213000,
        currency: "৳",
        dueDate: "20 Oct 2026",
        docsStatus: "Attached",
    },
    {
        id: "r3",
        entity: "NGL-26",
        clientDescription: "University of Asia Pacific — Pharmaceuticals",
        type: "Tender Security",
        amount: 4500,
        currency: "৳",
        dueDate: "05 Nov 2026",
        docsStatus: "Missing",
    },
    {
        id: "r4",
        entity: "NGL-26",
        clientDescription: "University of Asia Pacific — Civil Engineering",
        type: "Tender Security",
        amount: 3695,
        currency: "৳",
        dueDate: "05 Nov 2026",
        docsStatus: "Missing",
    },
    {
        id: "r5",
        entity: "NG-26",
        clientDescription: "Sonali Bank PLC — Radmin Software",
        type: "Tender Security",
        amount: 35000,
        currency: "৳",
        dueDate: "15 Sep 2026",
        docsStatus: "Attached",
    },
    {
        id: "r6",
        entity: "NG-26",
        clientDescription: "EGCB — Acronis Backup",
        type: "Tender Security",
        amount: 110000,
        currency: "৳",
        dueDate: "15 Sep 2026",
        docsStatus: "Attached",
    },
    {
        id: "r7",
        entity: "NG-26",
        clientDescription: "EGCB — Acronis Backup",
        type: "Performance Security",
        amount: 449752.5,
        currency: "৳",
        dueDate: "15 Sep 2026",
        docsStatus: "Missing",
    },
    {
        id: "r8",
        entity: "JT",
        clientDescription: "Pending deposit",
        type: "Bank Guarantee",
        amount: 10500,
        currency: "৳",
        dueDate: "30 Sep 2026",
        docsStatus: "Missing",
    },
];

/* ---------- Page ---------- */
export default function TenderSecurityPage() {
    const [rows, setRows] = useState<SecurityRow[]>(INITIAL_ROWS);
    const [filters, setFilters] = useState<FilterState>({
        entity: "all",
        type: "all",
        docs: "all",
    });

    /* Apply filters */
    const filtered = useMemo(() => {
        return rows.filter((r) => {
            if (r.isDraft) return true; // always show draft row
            if (filters.entity !== "all" && r.entity !== filters.entity) return false;
            if (filters.type !== "all" && r.type !== filters.type) return false;
            if (filters.docs !== "all" && r.docsStatus !== filters.docs) return false;
            return true;
        });
    }, [rows, filters]);

    /* Derived stats */
    const stats = useMemo(() => {
        const nonDraft = rows.filter((r) => !r.isDraft);
        const totalPending = nonDraft.reduce((s, r) => s + r.amount, 0);
        const entitiesAffected = new Set(nonDraft.map((r) => r.entity)).size;

        return [
            {
                label: "Total Pending Security",
                value: `৳${totalPending.toLocaleString("en-IN")}`,
            },
            { label: "Entities Affected", value: String(entitiesAffected) },
            { label: "Receivable Outstanding", value: "৳0" },
            { label: "Payable Outstanding", value: "৳0" },
        ];
    }, [rows]);

    /* Add a fresh draft row */
    const addRecord = () => {
        // only one draft at a time
        if (rows.some((r) => r.isDraft)) return;
        const draft: SecurityRow = {
            id: `draft-${Date.now()}`,
            entity: ENTITIES[0],
            clientDescription: "",
            type: "Tender Security",
            amount: 0,
            currency: "৳",
            dueDate: "",
            docsStatus: "Missing",
            isDraft: true,
        };
        setRows((prev) => [...prev, draft]);
    };

    /* Update a draft row */
    const updateRow = (id: string, patch: Partial<SecurityRow>) => {
        setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        );
    };

    /* Save a draft → promote to normal row */
    const saveRow = (draft: SecurityRow) => {
        if (!draft.clientDescription.trim()) {
            // basic guard: don't save empty descriptions
            return;
        }
        setRows((prev) =>
            prev.map((r) =>
                r.id === draft.id
                    ? { ...r, isDraft: false, docsStatus: "Missing" }
                    : r,
            ),
        );
        // TODO: POST /api/v1/tenders/security
    };

    /* Delete a row (also used for cancel draft) */
    const deleteRow = (id: string) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
        // TODO: DELETE /api/v1/tenders/security/:id
    };

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
                <SecurityHeader onAdd={addRecord} />
                <SecurityStats stats={stats} />
                <SecurityFilters
                    value={filters}
                    entities={ENTITIES}
                    types={TYPES}
                    onChange={setFilters}
                />
                <SecurityTable
                    rows={filtered}
                    entities={ENTITIES}
                    types={TYPES}
                    onCreate={saveRow}
                    onUpdate={updateRow}
                    onDelete={deleteRow}
                />
                <SecurityFooter />
            </div>
        </main>
    );
}