// components/tender/documents/DocsGrid.tsx
"use client";

import { DocCard } from "./DocCard";
import type { CompanyDocUI } from "@/lib/api/mappers";

interface Props {
  docs: CompanyDocUI[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onAction?: (doc: CompanyDocUI) => void;
  onDelete?: (doc: CompanyDocUI) => void;   // ← NEW
  emptyMessage?: string;
}

export function DocsGrid({
  docs,
  selectedIds,
  onToggleSelect,
  onAction,
  onDelete,                                 // ← NEW
  emptyMessage = "No documents in this category yet.",
}: Props) {
  if (!docs.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-xs text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc) => (
        <DocCard
          key={doc.id}
          doc={doc}
          selected={selectedIds.has(doc.id)}
          onToggleSelect={onToggleSelect}
          onAction={onAction}
          onDelete={onDelete}                // ← NEW
        />
      ))}
    </div>
  );
}