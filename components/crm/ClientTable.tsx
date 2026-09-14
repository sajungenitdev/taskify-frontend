// components/crm/ClientTable.tsx
"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Eye, MapPin, Trash2, Building2, UserX, Calendar, Layers } from "lucide-react";
import { formatDate, getOwnerName, initials } from "@/utils/format";
import type { Client } from "@/types/crm/crm.types";

interface Props {
  clients: Client[];
  loading?: boolean;
  onDelete?: (c: Client) => void;
}

const STAGE_STYLES: Record<Client["stage"], { badge: string; dot: string }> = {
  hot: {
    badge: "border-rose-200/80 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  warm: {
    badge: "border-amber-200/80 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  won: {
    badge: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  cold: {
    badge: "border-sky-200/80 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
};

export const ClientTable = memo(function ClientTable({
  clients,
  loading = false,
  onDelete,
}: Props) {
  if (loading) {
    return <ClientTableSkeleton />;
  }

  if (!clients.length) {
    return (
      <div className="flex flex-col items-center justify-center p-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
          <UserX className="h-6 w-6" />
        </div>
        <h3 className="mt-3.5 text-sm font-bold text-slate-900">No Clients Found</h3>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          No records match your active query. Adjust your filters or register a new client account.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[940px] border-collapse text-left text-xs">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <th scope="col" className="px-5 py-3.5">
              Client Account
            </th>
            <th scope="col" className="px-5 py-3.5">
              Territory / Location
            </th>
            <th scope="col" className="px-5 py-3.5">
              Pipeline Stage
            </th>
            <th scope="col" className="px-5 py-3.5">
              Assigned Representative
            </th>
            <th scope="col" className="px-5 py-3.5 text-center">
              Monthly Frequency
            </th>
            <th scope="col" className="px-5 py-3.5">
              Last Interaction
            </th>
            <th scope="col" className="px-5 py-3.5 text-center">
              Open RFQs
            </th>
            <th scope="col" className="w-[100px] px-5 py-3.5 text-right">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 bg-white">
          {clients.map((client) => {
            const stageConfig = STAGE_STYLES[client.stage] ?? {
              badge: "border-slate-200 bg-slate-50 text-slate-600",
              dot: "bg-slate-400",
            };
            const locationString = [client.city, client.location].filter(Boolean).join(", ");
            const ownerName = getOwnerName(client.assignedRep);

            return (
              <tr
                key={client._id}
                className="group transition-colors duration-150 hover:bg-slate-50/70"
              >
                {/* Client Identification Cell */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-white shadow-2xs">
                      {initials(client.name)}
                    </div>
                    <div className="min-w-0 max-w-[220px]">
                      <Link
                        href={`/crm/clients/${client._id}`}
                        className="truncate text-xs font-bold text-slate-900 hover:text-indigo-600 hover:underline block"
                      >
                        {client.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                        <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">{client.sector || "General Industry"}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Location */}
                <td className="px-5 py-3.5">
                  {locationString ? (
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium truncate max-w-[180px]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{locationString}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Stage */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold capitalize ${stageConfig.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${stageConfig.dot}`} />
                    <span>{client.stage}</span>
                  </span>
                </td>

                {/* Assigned Representative */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-700">
                      {initials(ownerName)}
                    </div>
                    <span className="text-xs font-semibold text-slate-800">
                      {ownerName}
                    </span>
                  </div>
                </td>

                {/* Visits per Month */}
                <td className="px-5 py-3.5 text-center font-mono whitespace-nowrap">
                  <span className="inline-flex items-center justify-center rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {client.visitsPerMonth ?? 0}
                  </span>
                </td>

                {/* Last Visit Timestamp */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {client.lastVisitAt ? (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(client.lastVisitAt)}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Open RFQ Pipeline Counter */}
                <td className="px-5 py-3.5 text-center whitespace-nowrap">
                  {client.openRfqCount ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200/80 bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700">
                      <Layers className="h-3 w-3" />
                      {client.openRfqCount}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-slate-400">0</span>
                  )}
                </td>

                {/* Context Actions */}
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/crm/clients/${client._id}`}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden"
                      title="Inspect Profile"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete?.(client)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-hidden cursor-pointer"
                      title="Archive Client"
                    >
                      <Trash2 className="h-4 w-4" />
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

function ClientTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3.5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100" />
            <div className="space-y-1.5">
              <div className="h-3 w-36 rounded-md bg-slate-100" />
              <div className="h-2.5 w-24 rounded-md bg-slate-50" />
            </div>
          </div>
          <div className="h-3 w-28 rounded-md bg-slate-100" />
          <div className="h-5 w-16 rounded-md bg-slate-100" />
          <div className="h-3 w-24 rounded-md bg-slate-100" />
          <div className="h-5 w-10 rounded-md bg-slate-100" />
          <div className="h-3 w-20 rounded-md bg-slate-100" />
          <div className="h-5 w-8 rounded-md bg-slate-100" />
          <div className="flex gap-1">
            <div className="h-7 w-7 rounded-lg bg-slate-100" />
            <div className="h-7 w-7 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}