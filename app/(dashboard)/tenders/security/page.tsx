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

export default function TenderSecurityPage() {
  const [notifyEntity, setNotifyEntity] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    entity: "all",
    type: "all",
    docs: "all",
  });

  /* ---------- Edit tracking ---------- */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPatch, setEditPatch] = useState<Partial<SecurityRowUI>>({});

  /* ---------- Per-action loading flags ---------- */
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  const { rows, loading, refetch } = useSecurity({
    entity: filters.entity === "all" ? undefined : filters.entity,
    type: filters.type === "all" ? undefined : filters.type,
    docs: filters.docs === "all" ? undefined : filters.docs,
    limit: 200,
  });

  const { stats, loading: statsLoading, refetch: refetchStats } =
    useSecurityStats();

  const uiRows: SecurityRowUI[] = useMemo(() => {
    const base = rows.map(toSecurityUIRow);
    if (!editingId) return base;
    return base.map((r) =>
      r.id === editingId ? { ...r, ...editPatch, isEditing: true } : r,
    );
  }, [rows, editingId, editPatch]);

  /* ---------- Draft ---------- */
  const [draft, setDraft] = useState<SecurityRowUI | null>(null);

  const addRecord = () => {
    if (uiRows.some((r) => r.isDraft)) return;
    if (editingId) return;
    if (savingId || deletingId) return;
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

  /* ---------- Save draft ---------- */
  const saveRow = async (r: SecurityRowUI) => {
    if (!r.clientDescription.trim()) {
      toast.error("Description is required");
      return;
    }
    /* Block if this row is already saving */
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

  /* ---------- Update draft/edit patch ---------- */
  const updateRow = (id: string, patch: Partial<SecurityRowUI>) => {
    if (draft && draft.id === id) {
      setDraft({ ...draft, ...patch });
      return;
    }
    if (editingId === id) {
      setEditPatch((prev) => ({ ...prev, ...patch }));
    }
  };

  /* ---------- Start edit ---------- */
  const startEdit = (id: string) => {
    if (draft) return;
    if (savingId || deletingId || notifyingId) return;
    setEditingId(id);
    setEditPatch({});
  };

  /* ---------- Save edit ---------- */
  const saveEdit = async (id: string) => {
    if (savingId === id) return;

    /* Nothing changed → exit */
    if (!editPatch || Object.keys(editPatch).length === 0) {
      setEditingId(null);
      setEditPatch({});
      return;
    }

    /* Description guard */
    const merged = { ...editPatch };
    if (
      typeof merged.clientDescription === "string" &&
      !merged.clientDescription.trim()
    ) {
      toast.error("Description is required");
      return;
    }

    /* Convert date */
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

  /* ---------- Cancel edit ---------- */
  const cancelEdit = () => {
    if (savingId === editingId) return;
    setEditingId(null);
    setEditPatch({});
  };

  /* ---------- Delete ---------- */
  const deleteRow = async (id: string) => {
    if (deletingId === id) return;

    /* Draft cancel is synchronous */
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

  /* ---------- Notify ---------- */
  const openNotify = (id: string) => {
    if (notifyingId) return;
    const row = uiRows.find((r) => r.id === id);
    if (!row) return;
    setNotifyingId(id);
    setNotifyEntity(row.entity);
  };

  const closeNotify = () => {
    setNotifyEntity(null);
    setNotifyingId(null);
  };

  const statTiles = useMemo(
    () => (stats ? toSecurityStatsTiles(stats) : []),
    [stats],
  );

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

        {loading ? (
          <div className="h-[300px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
        ) : (
          <SecurityTable
            rows={draft ? [...uiRows, draft] : uiRows}
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

        <SecurityFooter rows={uiRows} />
      </div>

      <SecurityNotifyModal
        open={!!notifyEntity}
        onOpenChange={(o) => {
          if (!o) closeNotify();
        }}
        entity={notifyEntity ?? ""}
        onSend={async (emails) => {
          try {
            // Replace with your real API call
            console.log("Send to:", emails);
            toast.success(
              `Notification sent to ${emails.length} recipient(s)`,
            );
            closeNotify();
          } catch (e) {
            toast.error((e as Error).message || "Failed to send");
            throw e;
          }
        }}
      />
    </main>
  );
}