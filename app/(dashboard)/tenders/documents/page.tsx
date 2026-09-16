"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DocsHeader } from "@/components/tender/documents/DocsHeader";
import { DocsTabs, type DocsTab } from "@/components/tender/documents/DocsTabs";
import { DocsGrid } from "@/components/tender/documents/DocsGrid";
import type { CompanyDoc } from "@/components/tender/documents/DocCard";
import {
    DocsFilterBar,
    type ExperienceFilters,
} from "@/components/tender/documents/DocsFilterBar";
import {
    ImportBar,
    type ImportTarget,
} from "@/components/tender/documents/ImportBar";
import toast from "react-hot-toast";
import { AddDocModal } from "@/components/tender/documents/modal/AddDocModal";
import { ViewDocModal } from "@/components/tender/documents/modal/ViewDocModal";

/* ---------- Mock tender targets for the import dropdown ---------- */
const IMPORT_TARGETS: ImportTarget[] = [
    { id: "p-bpdb", label: "Potential — BPDB (Acronis Renewal)", group: "Potential" },
    { id: "p-rupali", label: "Potential — Rupali Bank Ltd.", group: "Potential" },
    { id: "p-bapex", label: "Potential — BAPEX", group: "Potential" },
    { id: "s-metdept", label: "Submission — Bangladesh Meteorological Dept.", group: "Submission" },
    { id: "s-pgcb", label: "Submission — PGCB", group: "Submission" },
    { id: "s-janata", label: "Submission — Janata Bank PLC", group: "Submission" },
];

/* ---------- Seed data (legal + experience) ---------- */
const SEED: CompanyDoc[] = [
    // Legal
    {
        id: "d1",
        category: "legal",
        title: "Trade License",
        reference: "TRAD/DNCC/2026/04471",
        validity: "Valid until 30 Jun 2027",
        status: "Valid",
        action: "View",
    },
    {
        id: "d2",
        category: "legal",
        title: "TIN Certificate",
        reference: "178439827-8482",
        validity: "No expiry",
        status: "Valid",
        action: "View",
    },
    {
        id: "d3",
        category: "legal",
        title: "VAT Registration (BIN)",
        reference: "000493827-8482",
        validity: "No expiry",
        status: "Valid",
        action: "View",
    },
    {
        id: "d4",
        category: "legal",
        title: "Certificate of Incorporation",
        reference: "C-142857",
        validity: "No expiry",
        status: "Valid",
        action: "View",
    },
    {
        id: "d5",
        category: "legal",
        title: "Bank Solvency Certificate",
        reference: "Premier Bank, Shyamoli Branch",
        validity: "Issued 15 Jan 2026",
        status: "Expiring Soon",
        action: "Replace",
    },
    {
        id: "d6",
        category: "legal",
        title: "BASIS Membership",
        reference: "BASIS-2019-0847",
        validity: "Renewed annually",
        status: "Valid",
        action: "View",
    },

    // Work Experience
    {
        id: "e1",
        category: "experience",
        title: "EGCB",
        subtitle: "Acronis Backup Solutions, ongoing since 2023",
        chips: ["Power & Energy", "3+ Yrs", "৳5L+"],
        status: "Valid",
        ctaLabel: "View Certificate",
    },
    {
        id: "e2",
        category: "experience",
        title: "Bangladesh Bank",
        subtitle: "EViews software supply & support since 2021",
        chips: ["Financial", "5+ Yrs", "৳25L+"],
        status: "Valid",
        ctaLabel: "View Certificate",
    },
    {
        id: "e3",
        category: "experience",
        title: "Sonali Bank PLC",
        subtitle: "Radmin Software procurement, completed 2026",
        chips: ["Financial", "1+ Yr", "৳3L+"],
        status: "Valid",
        ctaLabel: "View Certificate",
    },
    {
        id: "e4",
        category: "experience",
        title: "Pubali Bank Ltd.",
        subtitle: "Self-service Kiosk supply and installation",
        chips: ["Financial", "1+ Yr", "৳5L+"],
        status: "Valid",
        ctaLabel: "View Certificate",
    },
    {
        id: "e5",
        category: "experience",
        title: "PGCB",
        subtitle: "Antivirus/EDR deployment across grid control network",
        chips: ["Government", "1+ Yr", "৳10L+"],
        status: "Valid",
        ctaLabel: "View Certificate",
    },
    {
        id: "e6",
        category: "experience",
        title: "Bangladesh Meteorological Dept.",
        subtitle: "BDWS Automation Software update and maintenance",
        chips: ["Government", "< 1 Yr", "৳10L+"],
        status: "Valid",
        ctaLabel: "View Certificate",
    },
];

const SECTORS = ["Power & Energy", "Financial", "Government"];

/* ---------- Page ---------- */
export default function CompanyDocsPage() {
    const [docs, setDocs] = useState<CompanyDoc[]>(SEED);
    const [tab, setTab] = useState<DocsTab>("legal");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [addOpen, setAddOpen] = useState(false);
    const [viewDoc, setViewDoc] = useState<CompanyDoc | null>(null);

    const [filters, setFilters] = useState<ExperienceFilters>({
        sector: "all",
        duration: "all",
        volume: "all",
    });

    /* Import state */
    const [importTargetId, setImportTargetId] = useState<string | null>(null);

    /* Counts per tab */
    const counts = useMemo<Record<DocsTab, number>>(
        () => ({
            legal: docs.filter((d) => d.category === "legal").length,
            profiles: docs.filter((d) => d.category === "profiles").length,
            experience: docs.filter((d) => d.category === "experience").length,
            certificates: docs.filter((d) => d.category === "certificates").length,
        }),
        [docs],
    );

    /* Filtered list for the current tab */
    const visible = useMemo(() => {
        let list = docs.filter((d) => d.category === tab);

        if (tab === "experience") {
            if (filters.sector !== "all") {
                list = list.filter((d) => d.chips?.includes(filters.sector));
            }
            if (filters.duration !== "all") {
                list = list.filter((d) => d.chips?.includes(filters.duration));
            }
            if (filters.volume !== "all") {
                list = list.filter((d) => d.chips?.includes(filters.volume));
            }
        }

        return list;
    }, [docs, tab, filters]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleImport = () => {
        if (!importTargetId || selectedIds.size === 0) return;

        const target = IMPORT_TARGETS.find((t) => t.id === importTargetId);
        const count = selectedIds.size;

        // TODO: POST /api/v1/tenders/:targetId/import-docs with [...selectedIds]
        toast.success(
            `${count} document${count === 1 ? "" : "s"} imported to ${target?.label ?? "tender"}`,
        );

        setSelectedIds(new Set());
        setImportTargetId(null);
    };

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-24 text-slate-900">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
                <DocsHeader />

                <DocsTabs active={tab} counts={counts} onChange={setTab} />

                {/* Add-doc button (hidden on experience tab) */}
                {tab !== "experience" && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setAddOpen(true)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Legal Doc
                        </button>
                    </div>
                )}

                {/* Filter bar — only on experience tab */}
                {tab === "experience" && (
                    <DocsFilterBar
                        value={filters}
                        onChange={setFilters}
                        sectors={SECTORS}
                    />
                )}

                <DocsGrid
                    docs={visible}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onAction={(doc) => {
                        if (doc.action === "Replace") setAddOpen(true);
                        else setViewDoc(doc);
                    }}
                />
            </div>

            {/* Floating import bar — appears when something is selected */}
            <ImportBar
                selectedCount={selectedIds.size}
                targets={IMPORT_TARGETS}
                value={importTargetId}
                onChangeTarget={setImportTargetId}
                onImport={handleImport}
            />

            {/* Modals */}
            <AddDocModal
                open={addOpen}
                onOpenChange={setAddOpen}
                category={tab}
                onCreated={(doc) => setDocs((prev) => [...prev, doc])}
            />
            <ViewDocModal
                open={!!viewDoc}
                onOpenChange={(o) => !o && setViewDoc(null)}
                doc={viewDoc}
            />
        </main>
    );
}