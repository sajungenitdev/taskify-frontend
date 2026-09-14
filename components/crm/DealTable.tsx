// components/crm/DealTable.tsx
"use client";

import React, { memo } from "react";
import Link from "next/link";
import {
    Building2,
    Calendar,
    Eye,
    Pencil,
    Sparkles,
    Trash2,
    TrendingUp,
    UserX,
} from "lucide-react";
import { formatDate, formatMoney, getOwnerName, initials } from "@/utils/format";
import type { Lead } from "@/types/crm/crm.types";

interface Props {
    leads: Lead[];
    loading?: boolean;
    onEdit?: (lead: Lead) => void;
    onDelete?: (lead: Lead) => void;
}

const STAGE_STYLES: Record<string, string> = {
    lead_in: "bg-slate-100 text-slate-700 border-slate-200",
    qualified: "bg-sky-50 text-sky-700 border-sky-200",
    proposal: "bg-indigo-50 text-indigo-700 border-indigo-200",
    negotiation: "bg-amber-50 text-amber-700 border-amber-200",
    won: "bg-emerald-50 text-emerald-700 border-emerald-200",
    lost: "bg-rose-50 text-rose-700 border-rose-200",
};

function stageLabel(stage: string) {
    return stage.replace(/_/g, " ");
}

export const DealTable = memo(function DealTable({
    leads,
    loading = false,
    onEdit,
    onDelete,
}: Props) {
    if (loading) {
        return (
            <div className="divide-y divide-slate-100 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3.5 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-slate-100" />
                            <div className="space-y-1.5">
                                <div className="h-3 w-40 rounded-md bg-slate-100" />
                                <div className="h-2.5 w-24 rounded-md bg-slate-50" />
                            </div>
                        </div>
                        <div className="h-3 w-20 rounded-md bg-slate-100" />
                        <div className="h-5 w-16 rounded-md bg-slate-100" />
                        <div className="h-3 w-20 rounded-md bg-slate-100" />
                        <div className="h-7 w-20 rounded-lg bg-slate-100" />
                    </div>
                ))}
            </div>
        );
    }

    if (!leads.length) {
        return (
            <div className="flex flex-col items-center justify-center p-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
                    <UserX className="h-6 w-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">No Deals Found</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                    No records match your active filters. Adjust them or create a new deal.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-xs">
                <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                        <th className="px-5 py-3.5">Deal</th>
                        <th className="px-5 py-3.5">Stage</th>
                        <th className="px-5 py-3.5">Value</th>
                        <th className="px-5 py-3.5">Probability</th>
                        <th className="px-5 py-3.5">Owner</th>
                        <th className="px-5 py-3.5">Expected Close</th>
                        <th className="px-5 py-3.5">Score</th>
                        <th className="w-[120px] px-5 py-3.5 text-right">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                    {leads.map((lead) => {
                        const owner = getOwnerName(lead.owner);
                        const probability = lead.probability ?? 0;
                        const score = lead.score ?? 0;

                        return (
                            <tr
                                key={lead._id}
                                className="group transition-colors duration-150 hover:bg-slate-50/70"
                            >
                                {/* Deal */}
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-white shadow-2xs">
                                            {initials(lead.dealName || lead.companyName)}
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/crm/deals/${lead._id}`}
                                                className="block truncate text-xs font-bold text-slate-900 hover:text-indigo-600 hover:underline"
                                            >
                                                {lead.dealName || `${lead.companyName} Deal`}
                                            </Link>
                                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                                <span className="truncate max-w-[220px]">{lead.companyName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Stage */}
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${STAGE_STYLES[lead.stage] ?? "bg-slate-100 text-slate-700 border-slate-200"
                                            }`}
                                    >
                                        {stageLabel(lead.stage)}
                                    </span>
                                </td>

                                {/* Value */}
                                <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                                    {formatMoney(lead.value, lead.currency || "BDT")}
                                </td>

                                {/* Probability */}
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold ${probability >= 70
                                                ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
                                                : probability >= 40
                                                    ? "border-amber-200/80 bg-amber-50 text-amber-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600"
                                            }`}
                                    >
                                        <TrendingUp className="h-2.5 w-2.5" />
                                        {probability}%
                                    </span>
                                </td>

                                {/* Owner */}
                                <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-700">
                                    {owner}
                                </td>

                                {/* Expected Close */}
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                    {lead.expectedCloseDate ? (
                                        <span className="inline-flex items-center gap-1 text-slate-600">
                                            <Calendar className="h-3 w-3 text-slate-400" />
                                            {formatDate(lead.expectedCloseDate)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>

                                {/* Score */}
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                    {lead.score != null ? (
                                        <span
                                            className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold ${score >= 70
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : score >= 40
                                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-600"
                                                }`}
                                        >
                                            <Sparkles className="h-2.5 w-2.5 text-slate-400" />
                                            {score}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1">
                                        <Link
                                            href={`/crm/deals/${lead._id}`}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                            title="Open deal workspace"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onEdit?.(lead);
                                            }}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                                            title="Edit deal"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDelete?.(lead);
                                            }}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                            title="Delete deal"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});