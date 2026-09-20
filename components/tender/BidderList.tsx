// components/tender/submission/BidderList.tsx
"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import type { SubmissionParticipant } from "@/lib/api/tender.api";

interface Props {
  bidders: SubmissionParticipant[];
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function fmtBDT(n: number) {
  if (!n) return "—";
  return `৳${n.toLocaleString("en-IN")}`;
}

export function BidderList({ bidders, onAdd, onEdit, onDelete }: Props) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Other Participants
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Plus className="h-3 w-3" />
          Add Bidder
        </button>
      </header>

      {bidders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 p-6 text-center text-[11px] text-slate-500">
          No competing bidders recorded yet. Click <b>Add Bidder</b> to add one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Bidder
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Bid Value
                </th>
                <th className="w-24 px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bidders.map((b, i) => (
                <tr
                  key={`${b.bidder}-${i}`}
                  className={`border-b border-slate-100 last:border-b-0 ${
                    b.isUs ? "bg-amber-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {b.bidder}
                    {b.isUs && (
                      <span className="ml-1.5 text-[10px] font-semibold text-amber-700">
                        (us)
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right ${
                      b.isUs ? "font-bold text-amber-700" : "text-slate-700"
                    }`}
                  >
                    {fmtBDT(b.value)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Edit bidders"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={onDelete}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Delete all bidders"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}