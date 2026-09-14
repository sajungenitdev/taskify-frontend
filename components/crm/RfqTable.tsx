// components/crm/RfqTable.tsx
"use client";
import { FileText } from "lucide-react";
import { formatDate, formatMoney } from "@/utils/format";
import type { Rfq } from "@/types/crm/crm.types";

const statusColor: Record<Rfq["status"], string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  submitted:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  closed:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  cancelled:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
};

export function RfqTable({ rfqs }: { rfqs: Rfq[] }) {
  if (!rfqs.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-800">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
          <FileText className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          No RFQs yet
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Submitted RFQs will appear here once they're created.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Reference</th>
            <th className="px-4 py-3 font-medium">Value</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rfqs.map((r) => (
            <tr
              key={r._id}
              className="transition hover:bg-gray-50/60 dark:hover:bg-white/5"
            >
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                {r.title}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {r.reference || "—"}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(r.value, r.currency)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor[r.status]}`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {formatDate(r.submittedAt)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {formatDate(r.dueAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}