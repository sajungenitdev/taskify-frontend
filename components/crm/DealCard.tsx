// components/crm/DealCard.tsx
"use client";

import React, { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Calendar, GripVertical, Building2, TrendingUp, Sparkles } from "lucide-react";
import { formatMoney, formatDate, initials, getOwnerName } from "@/utils/format";
import type { Lead } from "@/types/crm/crm.types";

interface Props {
    lead: Lead;
    isPending?: boolean;
    isOverlay?: boolean;
}

export const DealCard = memo(function DealCard({
    lead,
    isPending = false,
    isOverlay = false,
}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: lead._id,
        data: { lead },
        disabled: isPending || isOverlay,
    });

    // Force hardware acceleration and prevent CSS transition stutter while dragging
    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? "none" : transition || undefined,
        willChange: isDragging ? "transform, opacity" : "auto",
    };

    const probability = lead.probability ?? (lead.stage === "won" ? 100 : 50);
    const ownerName = getOwnerName(lead.owner);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative rounded-xl border bg-white p-3.5 shadow-2xs transition-shadow duration-150 ${isOverlay
                    ? "rotate-2 border-slate-900 shadow-2xl ring-2 ring-slate-900/10 scale-[1.02] cursor-grabbing"
                    : isDragging
                        ? "border-dashed border-slate-300 bg-slate-50/50 opacity-25 shadow-none"
                        : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                } ${isPending ? "pointer-events-none opacity-60" : ""}`}
        >
            {/* Top Header: Title & Score Badge */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <Link
                        href={`/crm/deals/${lead._id}`}
                        onClick={(e) => {
                            if (isDragging || isOverlay) e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="block truncate text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                        title={lead.dealName || lead.companyName}
                    >
                        {lead.dealName || `${lead.companyName} Deal`}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                        <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">{lead.companyName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {lead.score != null && (
                        <span
                            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold border ${lead.score >= 70
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : lead.score >= 40
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-slate-200 bg-slate-50 text-slate-600"
                                }`}
                            title="Lead Score"
                        >
                            <Sparkles className="h-2.5 w-2.5 text-slate-400" />
                            {lead.score}
                        </span>
                    )}
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        aria-label={`Drag ${lead.companyName} deal`}
                        className="cursor-grab p-0.5 text-slate-300 hover:text-slate-700 active:cursor-grabbing rounded hover:bg-slate-100 transition-colors touch-none"
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Center Row: Valuation & Win Probability */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="font-mono text-xs font-bold text-slate-950">
                    {formatMoney(lead.value, lead.currency || "BDT")}
                </span>

                <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold border ${probability >= 70
                            ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
                            : probability >= 40
                                ? "border-amber-200/80 bg-amber-50 text-amber-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                >
                    <TrendingUp className="h-2.5 w-2.5" />
                    {probability}%
                </span>
            </div>

            {/* Footer Row: Close Date & Account Owner */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-2">
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    {lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : "No deadline"}
                </span>

                {ownerName ? (
                    <div
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-[9px] font-bold text-white shadow-2xs shrink-0"
                        title={ownerName}
                    >
                        {initials(ownerName)}
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                )}
            </div>
        </div>
    );
});