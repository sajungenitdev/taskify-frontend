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
import { DocsListView } from "@/components/tender/documents/DocsListView";
import {
  DocsFilterBar,
  type ExperienceFilters,
  type DocsViewMode,
} from "@/components/tender/documents/DocsFilterBar";
import {
  ImportBar,
  type ImportTarget,
} from "@/components/tender/documents/ImportBar";
import {
  companyDocApi,
  type CompanyDocCategory,
  tenderApi,
} from "@/lib/api/tender.api";
import { toCompanyDocUI, type CompanyDocUI } from "@/lib/api/mappers";
import { AddDocModal } from "@/components/tender/documents/modal/AddDocModal";
import { ViewDocModal } from "@/components/tender/documents/modal/ViewDocModal";
import { confirmToast } from "@/lib/confirmToast";
import { useCompanyDocBundle } from "@/hooks/tender/useCompanyDocBundle";

/* ---------- Config ---------- */
const SECTORS = ["Power & Energy", "Financial", "Government"];

/* ---------- Import-target cache (module-level, 60s TTL) ---------- */
let TARGET_CACHE: { data: ImportTarget[]; ts: number } | null = null;
let TARGET_IN_FLIGHT: Promise<ImportTarget[]> | null = null;
const TARGET_TTL_MS = 60_000;

async function loadImportTargets(): Promise<ImportTarget[]> {
  if (TARGET_CACHE && Date.now() - TARGET_CACHE.ts < TARGET_TTL_MS) {
    return TARGET_CACHE.data;
  }
  if (TARGET_IN_FLIGHT) return TARGET_IN_FLIGHT;

  TARGET_IN_FLIGHT = (async () => {
    /* One call — both drafts + non-drafts, capped at 200 */
    const res = await tenderApi.list({ includeDrafts: true, limit: 200 });

    const list: ImportTarget[] = res.data
      .filter((t) => !t.draft)
      .map((t) => {
        const group: ImportTarget["group"] =
          t.stage === "potential"
            ? "Potential"
            : "Submission";
        return {
          id: t._id,
          label: `${t.tenderer} — ${t.title}`,
          group,
        };
      });

    TARGET_CACHE = { data: list, ts: Date.now() };
    TARGET_IN_FLIGHT = null;
    return list;
  })();

  return TARGET_IN_FLIGHT;
}

export default function CompanyDocsPage() {
  const [tab, setTab] = useState<DocsTab>("legal");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<CompanyDocUI | null>(null);
  const [renewDoc, setRenewDoc] = useState<CompanyDocUI | null>(null);
  const [viewMode, setViewMode] = useState<DocsViewMode>("grid");

  const [filters, setFilters] = useState<ExperienceFilters>({
    sector: "all",
    duration: "all",
    volume: "all",
  });

  /* ONE call returns list + counts */
  const { rows, counts, loading, refetch } = useCompanyDocBundle({
    category: tab,
    sector: tab === "experience" ? filters.sector : undefined,
    duration: tab === "experience" ? filters.duration : undefined,
    volume: tab === "experience" ? filters.volume : undefined,
  });

  const docs: CompanyDocUI[] = useMemo(
    () => rows.map(toCompanyDocUI),
    [rows],
  );

  /* ---------- Import targets ---------- */
  const [targets, setTargets] = useState<ImportTarget[]>(
    TARGET_CACHE?.data ?? [],
  );
  const [importTargetId, setImportTargetId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadImportTargets()
      .then((list) => {
        if (!cancelled) setTargets(list);
      })
      .catch(() => {
        /* silent */
      });
    return () => {
      cancelled = true;
    };
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
    try {
      if (renewDoc) {
        /* RENEW */
        await companyDocApi.renewDoc(renewDoc.id, {
          validityDate: payload.validityDate!,
          issuedOn: payload.issuedOn,
        });

        if (payload.file) {
          const loadingId = toast.loading(`Uploading ${payload.file.name}...`);
          try {
            await companyDocApi.uploadDocFile(renewDoc.id, payload.file);
            toast.success("Certificate renewed", { id: loadingId });
          } catch (e) {
            toast.error((e as Error).message || "File upload failed", {
              id: loadingId,
            });
          }
        } else {
          toast.success("Certificate renewed");
        }
        setRenewDoc(null);
      } else {
        /* CREATE */
        const created = await companyDocApi.create({
          category: payload.category ?? tab,
          title: payload.title,
          reference: payload.reference,
          validity: payload.validity,
          validityDate: payload.validityDate,
          issuedOn: payload.issuedOn,
          subtitle: payload.subtitle,
          chips: payload.chips,
          docType: payload.docType,
        });

        if (payload.file) {
          const loadingId = toast.loading(`Uploading ${payload.file.name}...`);
          try {
            await companyDocApi.uploadDocFile(created._id, payload.file);
            toast.success("Document saved", { id: loadingId });
          } catch (e) {
            toast.error((e as Error).message || "File upload failed", {
              id: loadingId,
            });
          }
        } else {
          toast.success("Document saved");
        }
      }

      setAddOpen(false);
      await refetch();
    } catch (e) {
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
          await refetch();
        } catch (e) {
          toast.error((e as Error).message || "Delete failed", {
            id: loadingId,
          });
        }
      },
    });
  };

  /* ---------- Action (View / Renew) ---------- */
  const handleAction = (doc: CompanyDocUI) => {
    if (doc.action === "Renew" || doc.action === "Replace") {
      setRenewDoc(doc);
      setAddOpen(true);
    } else {
      setViewDoc(doc);
    }
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
            view={viewMode}
            onViewChange={setViewMode}
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
        ) : viewMode === "list" ? (
          <DocsListView
            docs={docs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onAction={handleAction}
            onDelete={handleDelete}
            category={tab}
          />
        ) : (
          <DocsGrid
            docs={docs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onAction={handleAction}
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