// app/(dashboard)/tenders/documents/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { DocsHeader } from "@/components/tender/documents/DocsHeader";
import {
  DocsTabs,
  type DocsTab,
} from "@/components/tender/documents/DocsTabs";
import { DocsGrid } from "@/components/tender/documents/DocsGrid";
import {
  DocsFilterBar,
  type ExperienceFilters,
} from "@/components/tender/documents/DocsFilterBar";
import {
  ImportBar,
  type ImportTarget,
} from "@/components/tender/documents/ImportBar";
import {
  useCompanyDocs,
  useCompanyDocCounts,
} from "@/hooks/tender/useCompanyDocs";
import { companyDocApi, CompanyDocCategory, tenderApi } from "@/lib/api/tender.api";
import { toCompanyDocUI, type CompanyDocUI } from "@/lib/api/mappers";
import { useEffect } from "react";
import { AddDocModal } from "@/components/tender/documents/AddDocModal";
import { ViewDocModal } from "@/components/tender/documents/modal/ViewDocModal";
import { confirmToast } from "@/lib/confirmToast";

/* ---------- Config ---------- */
const SECTORS = ["Power & Energy", "Financial", "Government"];

export default function CompanyDocsPage() {
  const [tab, setTab] = useState<DocsTab>("legal");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<CompanyDocUI | null>(null);

  const [filters, setFilters] = useState<ExperienceFilters>({
    sector: "all",
    duration: "all",
    volume: "all",
  });

  /* Fetch docs for current tab (+ experience filters) */
  const { rows, loading, refetch } = useCompanyDocs({
    category: tab,
    sector: tab === "experience" ? filters.sector : undefined,
    duration: tab === "experience" ? filters.duration : undefined,
    volume: tab === "experience" ? filters.volume : undefined,
  });

  const { counts, refetch: refetchCounts } = useCompanyDocCounts();

  const docs: CompanyDocUI[] = useMemo(
    () => rows.map(toCompanyDocUI),
    [rows],
  );

  /* ---------- Import dropdown targets ---------- */
  const [targets, setTargets] = useState<ImportTarget[]>([]);
  const [importTargetId, setImportTargetId] = useState<string | null>(null);

  useEffect(() => {
    // Load potential + submission tenders to populate the import dropdown
    Promise.all([
      tenderApi.list({ stage: "potential", limit: 50 }),
      tenderApi.list({ stage: "active", limit: 50 }),
      tenderApi.list({ stage: "submitted", limit: 50 }),
    ])
      .then(([p, a, s]) => {
        const list: ImportTarget[] = [
          ...p.data.map((t) => ({
            id: t._id,
            label: `Potential — ${t.tenderer}`,
            group: "Potential" as const,
          })),
          ...a.data.map((t) => ({
            id: t._id,
            label: `Submission — ${t.tenderer}`,
            group: "Submission" as const,
          })),
          ...s.data.map((t) => ({
            id: t._id,
            label: `Submission — ${t.tenderer}`,
            group: "Submission" as const,
          })),
        ];
        setTargets(list);
      })
      .catch(() => {
        /* silent — dropdown just stays empty */
      });
  }, []);

  /* ---------- Selection ---------- */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ---------- Import selected docs into a tender ---------- */
  const handleImport = async () => {
    if (!importTargetId || selectedIds.size === 0) return;
    try {
      await companyDocApi.importToTender({
        targetTenderId: importTargetId,
        documentIds: Array.from(selectedIds),
      });
      const target = targets.find((t) => t.id === importTargetId);
      toast.success(
        `${selectedIds.size} document${selectedIds.size === 1 ? "" : "s"
        } imported to ${target?.label ?? "tender"}`,
      );
      setSelectedIds(new Set());
      setImportTargetId(null);
    } catch (e) {
      toast.error((e as Error).message || "Import failed");
    }
  };

  /* ---------- Create new doc (Add modal) ---------- */
  const handleCreate = async (payload: {
    title: string;
    reference?: string;
    validity?: string;
    file?: File;
    category?: CompanyDocCategory;
    docType?: string;
  }) => {
    try {
      /* 1. Create the record */
      const created = await companyDocApi.create({
        category: payload.category ?? tab,
        title: payload.title,
        reference: payload.reference,
        validity: payload.validity,
        status: "Valid",
        docType: payload.docType,
      });

      /* 2. Upload the file if one was chosen */
      if (payload.file) {
        const loadingId = toast.loading(`Uploading ${payload.file.name}...`);
        try {
          await companyDocApi.uploadDocFile(created._id, payload.file);
          toast.success("Document saved", { id: loadingId });
        } catch (e) {
          toast.error(
            (e as Error).message || "File upload failed",
            { id: loadingId },
          );
        }
      } else {
        toast.success("Document saved");
      }

      setAddOpen(false);
      await Promise.all([refetch(), refetchCounts()]);
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
    }
  };
  const handleDelete = (doc: CompanyDocUI) => {
    confirmToast({
      title: `Delete "${doc.title}"?`,
      description:
        "This will permanently remove the document and its attached file.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        const loadingId = toast.loading("Deleting...");
        try {
          await companyDocApi.remove(doc.id);
          toast.success("Document deleted", { id: loadingId });
          await Promise.all([refetch(), refetchCounts()]);
        } catch (e) {
          toast.error(
            (e as Error).message || "Delete failed",
            { id: loadingId },
          );
        }
      },
    });
  };

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-24 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <DocsHeader />

        <DocsTabs active={tab} counts={counts} onChange={setTab} />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
          >
            <Plus className="h-3.5 w-3.5" />
            {tab === "experience" ? "Add Work Experience" : "Add Document"}
          </button>
        </div>

        {tab === "experience" && (
          <DocsFilterBar
            value={filters}
            onChange={setFilters}
            sectors={SECTORS}
          />
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[180px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
              />
            ))}
          </div>
        ) : (
          <DocsGrid
            docs={docs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onAction={(doc) => {
              if (doc.action === "Replace") setAddOpen(true);
              else setViewDoc(doc);
            }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Floating import bar */}
      <ImportBar
        selectedCount={selectedIds.size}
        targets={targets}
        value={importTargetId}
        onChangeTarget={setImportTargetId}
        onImport={handleImport}
      />

      {/* Modals */}
      <AddDocModal
        open={addOpen}
        onOpenChange={setAddOpen}
        category={tab}
        onSubmit={handleCreate}
      />

      <ViewDocModal
        open={!!viewDoc}
        onOpenChange={(o) => !o && setViewDoc(null)}
        doc={viewDoc}
      />
    </main>
  );
}