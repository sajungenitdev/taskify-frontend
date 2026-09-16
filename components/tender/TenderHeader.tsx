"use client";

import { Plus } from "lucide-react";

interface Props {
    onAddTender: () => void;
}

export function TenderHeader({ onAddTender }: Props) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#b8860b]">
                    Tender Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    Tender Management
                </h1>
                <p className="mt-1 max-w-xl text-xs text-slate-500">
                    Daily potential tenders, active participation, and the Submitted /
                    Lost archive — document tasks live in Tender Submission.
                </p>
            </div>

            <button
                type="button"
                onClick={onAddTender}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
            >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tender</span>
            </button>
        </header>
    );
}