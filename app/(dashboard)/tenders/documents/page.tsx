// app/(dashboard)/tenders/documents/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  companyDocApi,
  CompanyDocCategory,
  tenderApi,
} from "@/lib/api/tender.api";
import { toCompanyDocUI, type CompanyDocUI } from "@/lib/api/mappers";
import { AddDocModal } from "@/components/tender/documents/modal/AddDocModal";
import { ViewDocModal } from "@/components/tender/documents/modal/ViewDocModal";
import { confirmToast } from "@/lib/confirmToast";

/* ---------- Config ---------- */
const SECTORS = ["Power & Energy", "Financial", "Government"];

export default function CompanyDocsPage() {
  const [tab, setTab] = useState<DocsTab>("legal");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<CompanyDocUI | null>(null);
  const [renewDoc, setRenewDoc] = useState<CompanyDocUI | null>(null);

  const [filters, setFilters] = useState<ExperienceFilters>({
    sector: "all",
    duration: "all",
    volume: "all",
  });

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

  /* 🔍 LOG 1 — what the list returned from the backend */
  useEffect(() => {
    console.log("🔍 [LOG 1] Raw backend rows:", rows);
    console.log("🔍 [LOG 1b] Mapped UI docs:", docs);
  }, [rows, docs]);

  /* ---------- Import dropdown targets ---------- */
  const [targets, setTargets] = useState<ImportTarget[]>([]);
  const [importTargetId, setImportTargetId] = useState<string | null>(null);

  useEffect(() => {
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
        /* silent */
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

  /* ---------- Import ---------- */
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

  /* ---------- Create OR Renew ---------- */
  const handleCreate = async (payload: {
    title: string;
    reference?: string;
    validity?: string;
    validityDate?: string;
    issuedOn?: string;
    subtitle?: string;
    chips?: string[];
    file?: File;
    category?: CompanyDocCategory;
    docType?: string;
  }) => {
    /* 🔍 LOG 2 — what the modal sent to this handler */
    console.log("🔍 [LOG 2] handleCreate called with payload:", payload);
    console.log("🔍 [LOG 2b] renewDoc is:", renewDoc);

    try {
      if (renewDoc) {
        /* -------- RENEW -------- */
        console.log("🔍 [LOG 3] RENEW branch — calling renewDoc API");

        const renewPayload = {
          validityDate: payload.validityDate!,
          issuedOn: payload.issuedOn,
        };
        console.log("🔍 [LOG 3b] Renew payload being sent:", renewPayload);

        const renewResult = await companyDocApi.renewDoc(
          renewDoc.id,
          renewPayload,
        );
        console.log("🔍 [LOG 3c] Renew API response:", renewResult);

        if (payload.file) {
          const loadingId = toast.loading(`Uploading ${payload.file.name}...`);
          try {
            await companyDocApi.uploadDocFile(renewDoc.id, payload.file);
            toast.success("Certificate renewed", { id: loadingId });
          } catch (e) {
            toast.error(
              (e as Error).message || "File upload failed",
              { id: loadingId },
            );
          }
        } else {
          toast.success("Certificate renewed");
        }

        setRenewDoc(null);
      } else {
        /* -------- CREATE -------- */
        console.log("🔍 [LOG 4] CREATE branch — calling create API");

        const createPayload = {
          category: payload.category ?? tab,
          title: payload.title,
          reference: payload.reference,
          validity: payload.validity,
          validityDate: payload.validityDate,   // ✅ CORRECT KEY
          issuedOn: payload.issuedOn,
          subtitle: payload.subtitle,
          chips: payload.chips,
          docType: payload.docType,
        };
        console.log("🔍 [LOG 4b] Create payload being sent:", createPayload);

        const created = await companyDocApi.create(createPayload);
        console.log("🔍 [LOG 4c] Create API response:", created);
        console.log(
          "🔍 [LOG 4d] Response status/action/validUntil:",
          created.status,
          created.action,
          created.validUntil,
        );

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
      }

      setAddOpen(false);

      console.log("🔍 [LOG 5] Refetching list...");
      await Promise.all([refetch(), refetchCounts()]);
      console.log("🔍 [LOG 5b] Refetch complete");
    } catch (e) {
      console.error("🔍 [LOG ERROR] handleCreate failed:", e);
      toast.error((e as Error).message || "Save failed");
    }
  };

  /* ---------- Delete ---------- */
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
            onClick={() => {
              setRenewDoc(null);
              setAddOpen(true);
            }}
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
              /* 🔍 LOG — what happens when Renew is clicked */
              console.log("🔍 [LOG ACTION] onAction clicked:", {
                title: doc.title,
                action: doc.action,
                status: doc.status,
                validUntil: doc.validUntil,
              });

              if (doc.action === "Renew" || doc.action === "Replace") {
                console.log("🔍 [LOG ACTION] Opening renew modal");
                setRenewDoc(doc);
                setAddOpen(true);
              } else {
                console.log("🔍 [LOG ACTION] Opening view modal");
                setViewDoc(doc);
              }
            }}
            onDelete={handleDelete}
          />
        )}
      </div>

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
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setRenewDoc(null);
        }}
        category={tab}
        onSubmit={handleCreate}
        renewDoc={renewDoc}
      />

      <ViewDocModal
        open={!!viewDoc}
        onOpenChange={(o) => !o && setViewDoc(null)}
        doc={viewDoc}
      />
    </main>
  );
}