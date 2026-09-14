// components/crm/DealStageColumn.tsx
"use client";

import React, { memo, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Layers } from "lucide-react";
import { formatCompact } from "@/utils/format";
import { DealCard } from "./DealCard";
import type { PipelineGroup } from "@/types/crm/crm.types";

interface Props {
  group: PipelineGroup;
  onAdd?: (stage: string) => void;
  pendingId?: string | null;
}

export const DealStageColumn = memo(function DealStageColumn({
  group,
  onAdd,
  pendingId,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: group.stage,
    data: { stage: group.stage },
  });

  const leadIds = useMemo(() => group.leads.map((l) => l._id), [group.leads]);

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full min-h-0 w-80 shrink-0 flex-col rounded-2xl border p-3 transition-colors ${isOver
          ? "border-slate-900 bg-slate-100/80 ring-2 ring-slate-900/10"
          : "border-slate-200/80 bg-slate-100/50"
        }`}
    >
      {/* Column Header Card — fixed */}
      <div className="flex shrink-0 items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: group.color || "#64748b" }}
          />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            {group.label}
          </h3>
          <span className="rounded-md border border-slate-200/70 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
            {group.count}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-700">
            {formatCompact(group.weighted ?? 0, "USD")}
          </span>
          <button
            type="button"
            onClick={() => onAdd?.(group.stage)}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
            title={`Add deal to ${group.label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Cards Scroll Area — flex-1 + min-h-0 so it scrolls, not the page */}
      <div className="mt-3 flex-1 min-h-0 space-y-2.5 overflow-y-auto pr-0.5">
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {group.leads.map((lead) => (
            <DealCard
              key={lead._id}
              lead={lead}
              isPending={pendingId === lead._id}
            />
          ))}
        </SortableContext>

        {group.leads.length === 0 && (
          <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 p-4 text-center">
            <Layers className="h-5 w-5 text-slate-300 mb-1" />
            <p className="text-xs font-medium text-slate-400">
              No deals in this stage
            </p>
            <button
              type="button"
              onClick={() => onAdd?.(group.stage)}
              className="mt-2 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
            >
              + Add deal
            </button>
          </div>
        )}
      </div>

      {/* Footer — fixed */}
      <button
        type="button"
        onClick={() => onAdd?.(group.stage)}
        className="mt-3 flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/80 py-2.5 text-xs font-semibold text-slate-600 hover:border-slate-900 hover:bg-white hover:text-slate-900 transition shadow-2xs cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add Deal</span>
      </button>
    </div>
  );
});