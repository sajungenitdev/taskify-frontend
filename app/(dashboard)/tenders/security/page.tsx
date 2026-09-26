// app/(dashboard)/tenders/security/page.tsx
"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SecurityHeader } from "@/components/tender/security/SecurityHeader";
import { SecurityStats } from "@/components/tender/security/SecurityStats";
import {
  SecurityFilters,
  type FilterState,
} from "@/components/tender/security/SecurityFilters";
import {
  SecurityTable,
  type SecurityType,
} from "@/components/tender/security/SecurityTable";
import { SecurityFooter } from "@/components/tender/security/SecurityFooter";
import {
  useSecurity,
  useSecurityStats,
} from "@/hooks/tender/useSecurity";
import { securityApi } from "@/lib/api/tender.api";
import {
  toSecurityUIRow,
  toSecurityStatsTiles,
  type SecurityRowUI,
} from "@/lib/api/mappers";
import { SecurityNotifyModal } from "@/components/tender/modal/SecurityNotifyModal";

const ENTITIES = ["NGL-26", "NG-26", "JT"];
const TYPES: SecurityType[] = [
  "Tender Security",
  "Performance Security",
  "Bank Guarantee",
];

type SecurityTab = "pending" | "done";

export default function TenderSecurityPage() {
  /* ============================================================
   * 1. All state declarations FIRST (so nothing is referenced
   *    before its declaration line).
   * ============================================================ */

  const [activeTab, setActiveTab] = useState<SecurityTab>("pending");

  const [notifyRow, setNotifyRow] = useState<{
    id: string;
    entity: string;
  } | null>(null);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    entity: "all",
    type: "all",
    docs: "all",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPatch, setEditPatch] = useState<Partial<SecurityRowUI>>({});

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ✅ Moved UP — must be declared before any useMemo references it
  const [draft, setDraft] = useState<SecurityRowUI | null>(null);

  /* ============================================================
   * 2. Data fetching
   * ============================================================ */

  const { rows, loading, refetch } = useSecurity({
    entity: filters.entity === "all" ? undefined : filters.entity,
    type: filters.type === "all" ? undefined : filters.type,
    // Docs filter is now driven by tabs — always pass undefined so both
    // lists are fetched at once and split client-side.
    docs: undefined,
    limit: 200,
  });

  const { stats, loading: statsLoading, refetch: refetchStats } =
    useSecurityStats();

  /* ============================================================
   * 3. Derived rows
   * ============================================================ */

  const allRows: SecurityRowUI[] = useMemo(() => {
    const base = rows.map(toSecurityUIRow);
    if (!editingId) return base;
    return base.map((r) =>
      r.id === editingId ? { ...r, ...editPatch, isEditing: true } : r,
    );
  }, [rows, editingId, editPatch]);

  const pendingRows = useMemo(
    () =>
      allRows.filter(
        (r) => r.docsStatus === "Missing" || Boolean(r.isDraft),
      ),
    [allRows],
  );

  const doneRows = useMemo(
    () => allRows.filter((r) => r.docsStatus === "Attached"),
    [allRows],
  );

  const visibleRows = useMemo(() => {
    const base = activeTab === "pending" ? pendingRows : doneRows;
    if (draft && activeTab === "pending") return [...base, draft];
    return base;
  }, [activeTab, pendingRows, doneRows, draft]);

  const counts = useMemo(
    () => ({
      pending: pendingRows.length,
      done: doneRows.length,
    }),
    [pendingRows, doneRows],
  );

  /* ============================================================
   * 4. Handlers
   * ============================================================ */

  const addRecord = () => {
    if (allRows.some((r) => r.isDraft)) return;
    if (editingId) return;
    if (savingId || deletingId) return;

    // Force switch to Pending tab so the draft is visible
    setActiveTab("pending");

    setDraft({
      id: `draft-${crypto.randomUUID()}`,
      entity: ENTITIES[0],
      clientDescription: "",
      type: "Tender Security",
      amount: 0,
      currency: "৳",
      dueDate: "",
      docsStatus: "Missing",
      isDraft: true,
    });
  };

  const saveRow = async (r: SecurityRowUI) => {
    if (!r.clientDescription.trim()) {
      toast.error("Description is required");
      return;
    }
    if (savingId === r.id) return;

    setSavingId(r.id);
    try {
      await securityApi.create({
        entity: r.entity,
        clientDescription: r.clientDescription,
        type: r.type,
        amount: r.amount,
        docsStatus: r.docsStatus,
        ...(r.dueDate ? { dueDate: new Date(r.dueDate).toISOString() } : {}),
      });
      toast.success("Security record saved");
      setDraft(null);
      await Promise.all([refetch(), refetchStats()]);
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const updateRow = (id: string, patch: Partial<SecurityRowUI>) => {
    if (draft && draft.id === id) {
      setDraft({ ...draft, ...patch });
      return;
    }
    if (editingId === id) {
      setEditPatch((prev) => ({ ...prev, ...patch }));
    }
  };

  const startEdit = (id: string) => {
    if (draft) return;
    if (savingId || deletingId || notifyingId) return;
    setEditingId(id);
    setEditPatch({});
  };

  const saveEdit = async (id: string) => {
    if (savingId === id) return;

    if (!editPatch || Object.keys(editPatch).length === 0) {
      setEditingId(null);
      setEditPatch({});
      return;
    }

    const merged = { ...editPatch };
    if (
      typeof merged.clientDescription === "string" &&
      !merged.clientDescription.trim()
    ) {
      toast.error("Description is required");
      return;
    }

    const payload: Record<string, unknown> = { ...merged };
    if (typeof merged.dueDate === "string") {
      payload.dueDate = merged.dueDate
        ? new Date(merged.dueDate).toISOString()
        : null;
    }

    setSavingId(id);
    try {
      await securityApi.update(id, payload);
      toast.success("Security record updated");
      setEditingId(null);
      setEditPatch({});
      await Promise.all([refetch(), refetchStats()]);
    } catch (e) {
      toast.error((e as Error).message || "Failed to save changes");
    } finally {
      setSavingId(null);
    }
  };

  const cancelEdit = () => {
    if (savingId === editingId) return;
    setEditingId(null);
    setEditPatch({});
  };

  const deleteRow = async (id: string) => {
    if (deletingId === id) return;

    if (draft && draft.id === id) {
      if (savingId === id) return;
      setDraft(null);
      return;
    }

    setDeletingId(id);
    try {
      await securityApi.remove(id);
      toast.success("Security record deleted");
      await Promise.all([refetch(), refetchStats()]);
    } catch (e) {
      toast.error((e as Error).message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const openNotify = (id: string) => {
    if (notifyingId) return;
    const row = allRows.find((r) => r.id === id);
    if (!row) return;
    setNotifyingId(id);
    setNotifyRow({ id: row.id, entity: row.entity });
  };

  const closeNotify = () => {
    setNotifyRow(null);
    setNotifyingId(null);
  };

  const statTiles = useMemo(
    () => (stats ? toSecurityStatsTiles(stats) : []),
    [stats],
  );

  /* ============================================================
   * 5. Render
   * ============================================================ */

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <SecurityHeader onAdd={addRecord} />

        {statsLoading || !stats ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[80px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
              />
            ))}
          </div>
        ) : (
          <SecurityStats stats={statTiles} />
        )}

        <SecurityFilters
          value={filters}
          entities={ENTITIES}
          types={TYPES}
          onChange={setFilters}
        />

        {/* ---------- Pending / Done Tabs ---------- */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          {(
            [
              { id: "pending", label: "Pending", count: counts.pending },
              { id: "done", label: "Done", count: counts.done },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id);
                  if (t.id === "done" && draft) setDraft(null);
                  if (editingId) {
                    setEditingId(null);
                    setEditPatch({});
                  }
                }}
                className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition-colors ${active
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                {t.label}
                <span
                  className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${active
                    ? "bg-[#a97400] text-white"
                    : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {t.count}
                </span>
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#a97400]" />
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="h-[300px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
        ) : (
          <SecurityTable
            rows={visibleRows}
            entities={ENTITIES}
            types={TYPES}
            savingId={savingId}
            deletingId={deletingId}
            notifyingId={notifyingId}
            onUpdate={(id, patch) => {
              updateRow(id, patch);
            }}
            onCreate={(d) => {
              if (d.id) void saveRow(d as SecurityRowUI);
            }}
            onDelete={(id) => {
              void deleteRow(id);
            }}
            onNotify={(id) => openNotify(id)}
            onEdit={(id) => startEdit(id)}
            onSaveEdit={(id) => {
              void saveEdit(id);
            }}
            onCancelEdit={() => cancelEdit()}
          />
        )}

        <SecurityFooter rows={visibleRows} />
      </div>

      <SecurityNotifyModal
        open={!!notifyRow}
        onOpenChange={(o) => {
          if (!o) closeNotify();
        }}
        entity={notifyRow?.entity ?? ""}
        variant="security"
        onSend={async (emails, note) => {
          if (!notifyRow) return;

          const loadingId = toast.loading("Sending notification...");
          try {
            const result = await securityApi.notify(notifyRow.id, {
              emails,
              note,
            });
            toast.success(
              `Sent to ${result.accepted?.length ?? emails.length} recipient(s)`,
              { id: loadingId },
            );
            closeNotify();
          } catch (e) {
            toast.error(
              (e as Error).message || "Failed to send notification",
              { id: loadingId },
            );
            throw e;
          }
        }}
      />
    </main>
  );
}