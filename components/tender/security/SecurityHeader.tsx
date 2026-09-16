"use client";

import { Plus } from "lucide-react";

interface Props {
  onAdd: () => void;
}

export function SecurityHeader({ onAdd }: Props) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#b8860b]">
          Tender Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Tender Security &amp; Payment
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-500">
          Every pending security record in one list, filterable by entity — and
          notify Finance directly.
        </p>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Security Record
      </button>
    </header>
  );
}